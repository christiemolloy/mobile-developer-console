import { shallow } from 'enzyme';
import React from 'react';
import BindButton from './BindButton';

/* TODO: Test needs update to work with latest PF4 changes */

const setup = (propOverrides = {}) => {
  const defaultProps = {
    buildConfig: {
      repoUrl: 'http://example.com',
      branch: 'example-branch',
      jobName: 'job-11010',
      jenkinsfilePath: 'https://jenkins.file/path'
    },
    service: {
      isBindingOperationInProgress: () => false
    },
    onClick: jest.fn()
  };

  const props = { ...defaultProps, ...propOverrides };
  const wrapper = shallow(<BindButton {...props} />);

  return {
    props,
    wrapper
  };
};

describe('Binding operation not in progress', () => {
  //const { wrapper } = setup();
  it('should render component', () => {
    const wrapper = shallow(<BindButton appName="job-11010" service={{isBindingOperationInProgress: () => false}} onClick={jest.fn()}/>);
    expect(wrapper.find('Button')).toHaveLength(1);
    //expect(wrapper.find('Button').contains('Create a binding')).toEqual(true);
  });
});

describe('onClick()', () => {
  const { wrapper } = setup();

  it('should press button', () => {
    const saveButton = wrapper.find('Button');

    expect(saveButton.simulate('click')).toHaveLength(1);
  });
});

describe('Binding operation in progress', () => {
  const { wrapper } = setup({ service: { isBindingOperationInProgress: () => true } });

  it('should not render component', () => {
    // this should pass when its null
    expect(wrapper.name()).toEqual(null);
    expect(wrapper.children()).toHaveLength(0);
  });
});